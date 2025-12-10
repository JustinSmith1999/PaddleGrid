/*
  # Multi-Tenant Architecture - Facilities Support

  ## Overview
  Adds multi-tenant support allowing multiple facilities/venues to use the platform.
  Each facility operates independently with its own courts, bookings, events, and settings.

  ## New Tables
  
  ### 1. `facilities`
  Central facility/venue information
  - `id` (uuid, PK) - Facility identifier
  - `name` (text) - Facility name
  - `slug` (text, unique) - URL-friendly identifier
  - `description` (text) - Facility description
  - `address` (text) - Physical address
  - `city` (text) - City
  - `state` (text) - State/province
  - `zip_code` (text) - Postal code
  - `country` (text) - Country
  - `phone` (text) - Contact phone
  - `email` (text) - Contact email
  - `website` (text) - Website URL
  - `logo_url` (text) - Logo image URL
  - `timezone` (text) - Facility timezone
  - `currency` (text) - Default currency (USD, EUR, etc.)
  - `stripe_account_id` (text) - Stripe Connect account ID
  - `settings` (jsonb) - Facility-specific settings
  - `is_active` (boolean) - Whether facility is active
  - `subscription_tier` (text) - Subscription plan tier
  - `subscription_status` (text) - Current subscription status
  - `trial_ends_at` (timestamptz) - Trial period end date
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 2. `facility_users`
  Maps users to facilities with roles
  - `id` (uuid, PK) - Mapping identifier
  - `facility_id` (uuid, FK) - Reference to facilities
  - `user_id` (uuid, FK) - Reference to profiles
  - `role` (text) - User role within facility: 'owner', 'admin', 'staff', 'member'
  - `permissions` (jsonb) - Specific permissions
  - `created_at` (timestamptz) - Creation timestamp

  ## Schema Changes
  Adds `facility_id` foreign key to existing tables:
  - courts
  - bookings
  - events
  - memberships
  - lessons
  - instructors
  - leagues

  ## Security
  - RLS policies updated to filter by facility_id
  - Users can only access data for facilities they're associated with
  - Facility owners/admins have full access to their facility's data

  ## Important Notes
  1. Existing data will be migrated to a default facility
  2. All new records must include facility_id
  3. Cross-facility queries are not permitted
  4. Each facility has isolated data
*/

-- Create facilities table
CREATE TABLE IF NOT EXISTS facilities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  address text,
  city text,
  state text,
  zip_code text,
  country text DEFAULT 'US',
  phone text,
  email text,
  website text,
  logo_url text,
  timezone text DEFAULT 'America/New_York',
  currency text DEFAULT 'usd',
  stripe_account_id text,
  settings jsonb DEFAULT '{
    "booking_advance_days": 30,
    "booking_min_duration": 1,
    "booking_max_duration": 3,
    "cancellation_hours": 24,
    "require_payment": true,
    "auto_confirm_bookings": false
  }'::jsonb,
  is_active boolean DEFAULT true,
  subscription_tier text DEFAULT 'trial' CHECK (subscription_tier IN ('trial', 'basic', 'professional', 'enterprise')),
  subscription_status text DEFAULT 'active' CHECK (subscription_status IN ('active', 'cancelled', 'past_due', 'unpaid')),
  trial_ends_at timestamptz DEFAULT (now() + INTERVAL '14 days'),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create facility_users junction table
CREATE TABLE IF NOT EXISTS facility_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id uuid NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'staff', 'member')),
  permissions jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  UNIQUE(facility_id, user_id)
);

-- Add facility_id to existing tables
DO $$
BEGIN
  -- Add facility_id to courts
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'courts' AND column_name = 'facility_id'
  ) THEN
    ALTER TABLE courts ADD COLUMN facility_id uuid REFERENCES facilities(id) ON DELETE CASCADE;
  END IF;

  -- Add facility_id to bookings
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'facility_id'
  ) THEN
    ALTER TABLE bookings ADD COLUMN facility_id uuid REFERENCES facilities(id) ON DELETE CASCADE;
  END IF;

  -- Add facility_id to events
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'facility_id'
  ) THEN
    ALTER TABLE events ADD COLUMN facility_id uuid REFERENCES facilities(id) ON DELETE CASCADE;
  END IF;

  -- Add facility_id to memberships
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'memberships' AND column_name = 'facility_id'
  ) THEN
    ALTER TABLE memberships ADD COLUMN facility_id uuid REFERENCES facilities(id) ON DELETE CASCADE;
  END IF;

  -- Add facility_id to instructors
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'instructors' AND column_name = 'facility_id'
  ) THEN
    ALTER TABLE instructors ADD COLUMN facility_id uuid REFERENCES facilities(id) ON DELETE CASCADE;
  END IF;

  -- Add facility_id to lessons
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lessons' AND column_name = 'facility_id'
  ) THEN
    ALTER TABLE lessons ADD COLUMN facility_id uuid REFERENCES facilities(id) ON DELETE CASCADE;
  END IF;

  -- Add facility_id to leagues
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leagues' AND column_name = 'facility_id'
  ) THEN
    ALTER TABLE leagues ADD COLUMN facility_id uuid REFERENCES facilities(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create default facility and migrate existing data
DO $$
DECLARE
  default_facility_id uuid;
BEGIN
  -- Insert default facility if it doesn't exist
  INSERT INTO facilities (name, slug, description, is_active)
  VALUES (
    'Demo Facility',
    'demo-facility',
    'Default facility for existing data',
    true
  )
  ON CONFLICT (slug) DO NOTHING
  RETURNING id INTO default_facility_id;

  -- Get the facility ID if it already exists
  IF default_facility_id IS NULL THEN
    SELECT id INTO default_facility_id FROM facilities WHERE slug = 'demo-facility';
  END IF;

  -- Update existing records with default facility_id
  UPDATE courts SET facility_id = default_facility_id WHERE facility_id IS NULL;
  UPDATE bookings SET facility_id = default_facility_id WHERE facility_id IS NULL;
  UPDATE events SET facility_id = default_facility_id WHERE facility_id IS NULL;
  UPDATE memberships SET facility_id = default_facility_id WHERE facility_id IS NULL;
  UPDATE instructors SET facility_id = default_facility_id WHERE facility_id IS NULL;
  UPDATE lessons SET facility_id = default_facility_id WHERE facility_id IS NULL;
  UPDATE leagues SET facility_id = default_facility_id WHERE facility_id IS NULL;

  -- Make existing admin users owners of default facility
  INSERT INTO facility_users (facility_id, user_id, role)
  SELECT default_facility_id, id, 'owner'
  FROM profiles
  WHERE role IN ('admin', 'owner')
  ON CONFLICT (facility_id, user_id) DO NOTHING;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_facilities_slug ON facilities(slug);
CREATE INDEX IF NOT EXISTS idx_facilities_active ON facilities(is_active);
CREATE INDEX IF NOT EXISTS idx_facility_users_facility ON facility_users(facility_id);
CREATE INDEX IF NOT EXISTS idx_facility_users_user ON facility_users(user_id);
CREATE INDEX IF NOT EXISTS idx_courts_facility ON courts(facility_id);
CREATE INDEX IF NOT EXISTS idx_bookings_facility ON bookings(facility_id);
CREATE INDEX IF NOT EXISTS idx_events_facility ON events(facility_id);
CREATE INDEX IF NOT EXISTS idx_memberships_facility ON memberships(facility_id);
CREATE INDEX IF NOT EXISTS idx_instructors_facility ON instructors(facility_id);
CREATE INDEX IF NOT EXISTS idx_lessons_facility ON lessons(facility_id);
CREATE INDEX IF NOT EXISTS idx_leagues_facility ON leagues(facility_id);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_facilities_updated_at ON facilities;
CREATE TRIGGER update_facilities_updated_at
  BEFORE UPDATE ON facilities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE facility_users ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user has facility access
CREATE OR REPLACE FUNCTION user_has_facility_access(facility_uuid uuid, user_uuid uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM facility_users
    WHERE facility_id = facility_uuid
    AND user_id = user_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get user's facilities
CREATE OR REPLACE FUNCTION get_user_facilities(user_uuid uuid)
RETURNS SETOF uuid AS $$
BEGIN
  RETURN QUERY
  SELECT facility_id FROM facility_users
  WHERE user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Facilities Policies
CREATE POLICY "Users can view facilities they belong to"
  ON facilities FOR SELECT
  TO authenticated
  USING (
    id IN (SELECT get_user_facilities(auth.uid()))
  );

CREATE POLICY "Facility owners can update their facilities"
  ON facilities FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM facility_users
      WHERE facility_users.facility_id = facilities.id
      AND facility_users.user_id = auth.uid()
      AND facility_users.role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM facility_users
      WHERE facility_users.facility_id = facilities.id
      AND facility_users.user_id = auth.uid()
      AND facility_users.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Platform admins can manage all facilities"
  ON facilities FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Facility Users Policies
CREATE POLICY "Users can view facility memberships they belong to"
  ON facility_users FOR SELECT
  TO authenticated
  USING (
    facility_id IN (SELECT get_user_facilities(auth.uid()))
  );

CREATE POLICY "Facility owners can manage facility users"
  ON facility_users FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM facility_users fu
      WHERE fu.facility_id = facility_users.facility_id
      AND fu.user_id = auth.uid()
      AND fu.role IN ('owner', 'admin')
    )
  );

-- Update existing RLS policies to include facility filtering

-- Courts policies - update to include facility access
DROP POLICY IF EXISTS "Anyone can view courts" ON courts;
CREATE POLICY "Users can view courts in their facilities"
  ON courts FOR SELECT
  TO authenticated
  USING (
    facility_id IN (SELECT get_user_facilities(auth.uid()))
  );

-- Bookings policies - update to include facility access
DROP POLICY IF EXISTS "Users can view own bookings" ON bookings;
CREATE POLICY "Users can view own bookings in their facilities"
  ON bookings FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR facility_id IN (
      SELECT fu.facility_id FROM facility_users fu
      WHERE fu.user_id = auth.uid()
      AND fu.role IN ('owner', 'admin', 'staff')
    )
  );

DROP POLICY IF EXISTS "Users can create bookings" ON bookings;
CREATE POLICY "Users can create bookings in their facilities"
  ON bookings FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND facility_id IN (SELECT get_user_facilities(auth.uid()))
  );

-- Events policies - update to include facility access
DROP POLICY IF EXISTS "Anyone can view published events" ON events;
CREATE POLICY "Users can view published events in their facilities"
  ON events FOR SELECT
  TO authenticated
  USING (
    is_published = true
    AND facility_id IN (SELECT get_user_facilities(auth.uid()))
  );

-- Memberships policies - update to include facility access
DROP POLICY IF EXISTS "Anyone can view active memberships" ON memberships;
CREATE POLICY "Users can view active memberships in their facilities"
  ON memberships FOR SELECT
  TO authenticated
  USING (
    is_active = true
    AND facility_id IN (SELECT get_user_facilities(auth.uid()))
  );

-- Instructors policies - update to include facility access
DROP POLICY IF EXISTS "Anyone can view active instructors" ON instructors;
CREATE POLICY "Users can view active instructors in their facilities"
  ON instructors FOR SELECT
  TO authenticated
  USING (
    is_active = true
    AND facility_id IN (SELECT get_user_facilities(auth.uid()))
  );

-- Lessons policies - update to include facility access
DROP POLICY IF EXISTS "Anyone can view lessons" ON lessons;
CREATE POLICY "Users can view lessons in their facilities"
  ON lessons FOR SELECT
  TO authenticated
  USING (
    facility_id IN (SELECT get_user_facilities(auth.uid()))
  );

-- Leagues policies - add facility access
CREATE POLICY "Users can view leagues in their facilities"
  ON leagues FOR SELECT
  TO authenticated
  USING (
    facility_id IN (SELECT get_user_facilities(auth.uid()))
  );

CREATE POLICY "Facility admins can manage leagues"
  ON leagues FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM facility_users
      WHERE facility_users.facility_id = leagues.facility_id
      AND facility_users.user_id = auth.uid()
      AND facility_users.role IN ('owner', 'admin', 'staff')
    )
  );
