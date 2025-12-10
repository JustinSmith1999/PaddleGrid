/*
  # Event Series Management System

  1. New Tables
    - `event_series`
      - Core series configuration with title, description, event type
      - Skill level ranges (min/max)
      - Pricing and capacity settings
      - Court assignments and timing
      - Publishing status and creator tracking
    
    - `event_series_occurrences`
      - Individual date instances within a series
      - Specific court and time assignments per date
      - Capacity and registration tracking per occurrence
      - Status tracking (scheduled, cancelled, completed)
      - Date-specific notes and overrides
    
    - `event_series_registrations`
      - User registrations for series occurrences
      - Payment status and amount tracking
      - Attendance check-in system
      - Registration status management

  2. Security
    - Enable RLS on all tables
    - Public read access for published series
    - Authenticated users can register
    - Admin-only write access for series management
    - Users can view their own registrations

  3. Features
    - Multi-date series scheduling
    - Flexible registration (full series or individual dates)
    - Waitlist management support
    - Attendance tracking
    - Court conflict detection support
    - Skill level filtering
*/

-- Create event type enum
DO $$ BEGIN
  CREATE TYPE event_type AS ENUM ('open_play', 'clinic', 'tournament', 'league', 'social');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create occurrence status enum
DO $$ BEGIN
  CREATE TYPE occurrence_status AS ENUM ('scheduled', 'cancelled', 'completed', 'in_progress');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create registration status enum
DO $$ BEGIN
  CREATE TYPE registration_status AS ENUM ('registered', 'cancelled', 'attended', 'no_show', 'waitlisted');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Event Series table
CREATE TABLE IF NOT EXISTS event_series (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text DEFAULT '',
  event_type event_type NOT NULL DEFAULT 'open_play',
  
  -- Skill level filtering
  skill_level_min numeric(3,1) DEFAULT 0.0,
  skill_level_max numeric(3,1) DEFAULT 7.0,
  
  -- Pricing and capacity
  price_per_session numeric(10,2) DEFAULT 0.00,
  series_discount_percentage integer DEFAULT 0,
  max_participants_per_session integer DEFAULT 8,
  
  -- Court and timing defaults
  court_ids uuid[] DEFAULT ARRAY[]::uuid[],
  default_start_time time,
  default_end_time time,
  default_duration_minutes integer DEFAULT 90,
  
  -- Settings
  allow_partial_registration boolean DEFAULT true,
  enable_waitlist boolean DEFAULT true,
  waitlist_limit integer DEFAULT 10,
  registration_deadline_hours integer DEFAULT 2,
  
  -- Publishing and metadata
  is_published boolean DEFAULT false,
  is_archived boolean DEFAULT false,
  created_by uuid REFERENCES profiles(id),
  organization_id uuid,
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT valid_skill_range CHECK (skill_level_min <= skill_level_max),
  CONSTRAINT valid_discount CHECK (series_discount_percentage >= 0 AND series_discount_percentage <= 100)
);

-- Event Series Occurrences table
CREATE TABLE IF NOT EXISTS event_series_occurrences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  series_id uuid NOT NULL REFERENCES event_series(id) ON DELETE CASCADE,
  
  -- Date and time
  occurrence_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  
  -- Court assignment
  court_id uuid REFERENCES courts(id),
  
  -- Capacity management
  max_participants integer NOT NULL,
  current_registrants integer DEFAULT 0,
  waitlist_count integer DEFAULT 0,
  
  -- Status and notes
  status occurrence_status DEFAULT 'scheduled',
  cancellation_reason text,
  notes text,
  
  -- Overrides
  custom_price numeric(10,2),
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT valid_time_range CHECK (start_time < end_time),
  CONSTRAINT valid_registrant_count CHECK (current_registrants >= 0),
  CONSTRAINT unique_series_date UNIQUE (series_id, occurrence_date, court_id)
);

-- Event Series Registrations table
CREATE TABLE IF NOT EXISTS event_series_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  series_id uuid NOT NULL REFERENCES event_series(id) ON DELETE CASCADE,
  occurrence_id uuid NOT NULL REFERENCES event_series_occurrences(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id),
  
  -- Registration details
  registration_date timestamptz DEFAULT now(),
  status registration_status DEFAULT 'registered',
  
  -- Payment tracking
  payment_status text DEFAULT 'pending',
  amount_paid numeric(10,2) DEFAULT 0.00,
  stripe_payment_intent_id text,
  
  -- Attendance tracking
  checked_in_at timestamptz,
  checked_in_by uuid REFERENCES profiles(id),
  
  -- Waitlist management
  waitlist_position integer,
  waitlist_notified_at timestamptz,
  waitlist_expires_at timestamptz,
  
  -- Metadata
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT unique_user_occurrence UNIQUE (occurrence_id, user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_event_series_published ON event_series(is_published) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_event_series_type ON event_series(event_type);
CREATE INDEX IF NOT EXISTS idx_event_series_skill_level ON event_series(skill_level_min, skill_level_max);
CREATE INDEX IF NOT EXISTS idx_event_series_archived ON event_series(is_archived) WHERE is_archived = false;

CREATE INDEX IF NOT EXISTS idx_occurrences_series ON event_series_occurrences(series_id);
CREATE INDEX IF NOT EXISTS idx_occurrences_date ON event_series_occurrences(occurrence_date);
CREATE INDEX IF NOT EXISTS idx_occurrences_court ON event_series_occurrences(court_id);
CREATE INDEX IF NOT EXISTS idx_occurrences_status ON event_series_occurrences(status);

CREATE INDEX IF NOT EXISTS idx_registrations_series ON event_series_registrations(series_id);
CREATE INDEX IF NOT EXISTS idx_registrations_occurrence ON event_series_registrations(occurrence_id);
CREATE INDEX IF NOT EXISTS idx_registrations_user ON event_series_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_registrations_status ON event_series_registrations(status);

-- Enable Row Level Security
ALTER TABLE event_series ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_series_occurrences ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_series_registrations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for event_series

-- Public can view published series
CREATE POLICY "Anyone can view published series"
  ON event_series FOR SELECT
  USING (is_published = true AND is_archived = false);

-- Authenticated users can view all series (for browsing)
CREATE POLICY "Authenticated users can view all active series"
  ON event_series FOR SELECT
  TO authenticated
  USING (is_archived = false);

-- Only admins/creators can insert series
CREATE POLICY "Admins can create series"
  ON event_series FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'facility_manager')
    )
  );

-- Only admins/creators can update series
CREATE POLICY "Admins can update series"
  ON event_series FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'facility_manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'facility_manager')
    )
  );

-- Only admins can delete series
CREATE POLICY "Admins can delete series"
  ON event_series FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'facility_manager')
    )
  );

-- RLS Policies for event_series_occurrences

-- Public can view occurrences of published series
CREATE POLICY "Anyone can view published occurrences"
  ON event_series_occurrences FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM event_series
      WHERE event_series.id = event_series_occurrences.series_id
      AND event_series.is_published = true
      AND event_series.is_archived = false
    )
  );

-- Admins can manage occurrences
CREATE POLICY "Admins can insert occurrences"
  ON event_series_occurrences FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'facility_manager')
    )
  );

CREATE POLICY "Admins can update occurrences"
  ON event_series_occurrences FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'facility_manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'facility_manager')
    )
  );

CREATE POLICY "Admins can delete occurrences"
  ON event_series_occurrences FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'facility_manager')
    )
  );

-- RLS Policies for event_series_registrations

-- Users can view their own registrations
CREATE POLICY "Users can view own registrations"
  ON event_series_registrations FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Admins can view all registrations
CREATE POLICY "Admins can view all registrations"
  ON event_series_registrations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'facility_manager')
    )
  );

-- Authenticated users can register
CREATE POLICY "Users can create own registrations"
  ON event_series_registrations FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can update their own registrations (for cancellations)
CREATE POLICY "Users can update own registrations"
  ON event_series_registrations FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Admins can update any registration (for check-ins)
CREATE POLICY "Admins can update all registrations"
  ON event_series_registrations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'facility_manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'facility_manager')
    )
  );

-- Users can delete their own registrations
CREATE POLICY "Users can delete own registrations"
  ON event_series_registrations FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Function to update occurrence registrant count
CREATE OR REPLACE FUNCTION update_occurrence_registrant_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.status = 'registered' THEN
      UPDATE event_series_occurrences
      SET current_registrants = current_registrants + 1
      WHERE id = NEW.occurrence_id;
    ELSIF NEW.status = 'waitlisted' THEN
      UPDATE event_series_occurrences
      SET waitlist_count = waitlist_count + 1
      WHERE id = NEW.occurrence_id;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status = 'registered' AND NEW.status != 'registered' THEN
      UPDATE event_series_occurrences
      SET current_registrants = current_registrants - 1
      WHERE id = NEW.occurrence_id;
    ELSIF OLD.status != 'registered' AND NEW.status = 'registered' THEN
      UPDATE event_series_occurrences
      SET current_registrants = current_registrants + 1
      WHERE id = NEW.occurrence_id;
    END IF;
    
    IF OLD.status = 'waitlisted' AND NEW.status != 'waitlisted' THEN
      UPDATE event_series_occurrences
      SET waitlist_count = waitlist_count - 1
      WHERE id = NEW.occurrence_id;
    ELSIF OLD.status != 'waitlisted' AND NEW.status = 'waitlisted' THEN
      UPDATE event_series_occurrences
      SET waitlist_count = waitlist_count + 1
      WHERE id = NEW.occurrence_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.status = 'registered' THEN
      UPDATE event_series_occurrences
      SET current_registrants = current_registrants - 1
      WHERE id = OLD.occurrence_id;
    ELSIF OLD.status = 'waitlisted' THEN
      UPDATE event_series_occurrences
      SET waitlist_count = waitlist_count - 1
      WHERE id = OLD.occurrence_id;
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to maintain registrant counts
DROP TRIGGER IF EXISTS trigger_update_occurrence_registrant_count ON event_series_registrations;
CREATE TRIGGER trigger_update_occurrence_registrant_count
  AFTER INSERT OR UPDATE OR DELETE ON event_series_registrations
  FOR EACH ROW
  EXECUTE FUNCTION update_occurrence_registrant_count();

-- Function to get series statistics
CREATE OR REPLACE FUNCTION get_series_stats(p_series_id uuid)
RETURNS json AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'total_occurrences', COUNT(DISTINCT o.id),
    'completed_occurrences', COUNT(DISTINCT o.id) FILTER (WHERE o.status = 'completed'),
    'upcoming_occurrences', COUNT(DISTINCT o.id) FILTER (WHERE o.occurrence_date >= CURRENT_DATE AND o.status = 'scheduled'),
    'total_registrations', COUNT(r.id),
    'total_revenue', COALESCE(SUM(r.amount_paid), 0),
    'unique_participants', COUNT(DISTINCT r.user_id),
    'average_attendance_rate', 
      CASE 
        WHEN COUNT(r.id) FILTER (WHERE o.status = 'completed') > 0
        THEN (COUNT(r.id) FILTER (WHERE r.status = 'attended')::numeric / 
              COUNT(r.id) FILTER (WHERE o.status = 'completed')::numeric * 100)
        ELSE 0
      END
  ) INTO result
  FROM event_series_occurrences o
  LEFT JOIN event_series_registrations r ON r.occurrence_id = o.id
  WHERE o.series_id = p_series_id;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;