/*
  # Add Event Categories System

  1. New Table
    - `event_categories`
      - `id` (uuid, primary key)
      - `name` (text) - Category name (e.g., "Clinics", "Tournaments")
      - `slug` (text) - URL-friendly identifier
      - `description` (text) - Category description
      - `color` (text) - Display color for UI
      - `icon` (text) - Icon identifier
      - `facility_id` (uuid) - Multi-tenant support
      - `is_active` (boolean) - Active status

  2. New Columns
    - `event_series.category_id` (uuid) - Links series to categories
    - `event_series.courtreserve_category` (text) - Store original category from CourtReserve

  3. Security
    - Enable RLS on event_categories
    - Public read access for active categories
    - Admin-only write access

  4. Indexes
    - Fast lookups by facility and category
    - Efficient filtering by category slug

  5. Seed Data
    - Default categories for all facilities
*/

-- Create event_categories table
CREATE TABLE IF NOT EXISTS event_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL,
  description text DEFAULT '',
  color text DEFAULT '#3B82F6',
  icon text DEFAULT 'calendar',
  facility_id uuid REFERENCES facilities(id) ON DELETE CASCADE,
  is_active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT unique_category_per_facility UNIQUE (facility_id, slug)
);

-- Add category_id to event_series
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'event_series' AND column_name = 'category_id'
  ) THEN
    ALTER TABLE event_series
    ADD COLUMN category_id uuid REFERENCES event_categories(id) ON DELETE SET NULL;
    
    COMMENT ON COLUMN event_series.category_id IS 'Category this event belongs to';
  END IF;
END $$;

-- Add courtreserve_category to event_series
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'event_series' AND column_name = 'courtreserve_category'
  ) THEN
    ALTER TABLE event_series
    ADD COLUMN courtreserve_category text;
    
    COMMENT ON COLUMN event_series.courtreserve_category IS 'Original category from CourtReserve API';
  END IF;
END $$;

-- Enable RLS on event_categories
ALTER TABLE event_categories ENABLE ROW LEVEL SECURITY;

-- Public read access for active categories
CREATE POLICY "Anyone can view active categories"
  ON event_categories
  FOR SELECT
  USING (is_active = true);

-- Facility admins can manage categories
CREATE POLICY "Facility admins can manage categories"
  ON event_categories
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM facility_users
      WHERE facility_users.facility_id = event_categories.facility_id
      AND facility_users.user_id = auth.uid()
      AND facility_users.role IN ('admin', 'owner')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM facility_users
      WHERE facility_users.facility_id = event_categories.facility_id
      AND facility_users.user_id = auth.uid()
      AND facility_users.role IN ('admin', 'owner')
    )
  );

-- Service role can manage all categories
CREATE POLICY "Service role can manage categories"
  ON event_categories
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_event_categories_facility
  ON event_categories(facility_id, is_active);

CREATE INDEX IF NOT EXISTS idx_event_categories_slug
  ON event_categories(slug)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_event_series_category
  ON event_series(category_id)
  WHERE category_id IS NOT NULL;

-- Insert default categories for existing facilities
INSERT INTO event_categories (name, slug, description, color, icon, facility_id, display_order)
SELECT 
  'Open Play' as name,
  'open-play' as slug,
  'Casual play sessions open to all skill levels' as description,
  '#10B981' as color,
  'users' as icon,
  f.id as facility_id,
  1 as display_order
FROM facilities f
WHERE NOT EXISTS (
  SELECT 1 FROM event_categories ec 
  WHERE ec.facility_id = f.id AND ec.slug = 'open-play'
);

INSERT INTO event_categories (name, slug, description, color, icon, facility_id, display_order)
SELECT 
  'Clinics' as name,
  'clinics' as slug,
  'Skill-building sessions with professional instruction' as description,
  '#3B82F6' as color,
  'graduation-cap' as icon,
  f.id as facility_id,
  2 as display_order
FROM facilities f
WHERE NOT EXISTS (
  SELECT 1 FROM event_categories ec 
  WHERE ec.facility_id = f.id AND ec.slug = 'clinics'
);

INSERT INTO event_categories (name, slug, description, color, icon, facility_id, display_order)
SELECT 
  'Tournaments' as name,
  'tournaments' as slug,
  'Competitive events and championship play' as description,
  '#EF4444' as color,
  'trophy' as icon,
  f.id as facility_id,
  3 as display_order
FROM facilities f
WHERE NOT EXISTS (
  SELECT 1 FROM event_categories ec 
  WHERE ec.facility_id = f.id AND ec.slug = 'tournaments'
);

INSERT INTO event_categories (name, slug, description, color, icon, facility_id, display_order)
SELECT 
  'Leagues' as name,
  'leagues' as slug,
  'Organized leagues and season play' as description,
  '#8B5CF6' as color,
  'award' as icon,
  f.id as facility_id,
  4 as display_order
FROM facilities f
WHERE NOT EXISTS (
  SELECT 1 FROM event_categories ec 
  WHERE ec.facility_id = f.id AND ec.slug = 'leagues'
);

INSERT INTO event_categories (name, slug, description, color, icon, facility_id, display_order)
SELECT 
  'Social Events' as name,
  'social' as slug,
  'Social mixers, round robins, and community events' as description,
  '#F59E0B' as color,
  'heart' as icon,
  f.id as facility_id,
  5 as display_order
FROM facilities f
WHERE NOT EXISTS (
  SELECT 1 FROM event_categories ec 
  WHERE ec.facility_id = f.id AND ec.slug = 'social'
);

-- Function to auto-assign category based on event_type
CREATE OR REPLACE FUNCTION assign_event_category()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.category_id IS NULL AND NEW.facility_id IS NOT NULL THEN
    -- Map event_type to category slug
    NEW.category_id := (
      SELECT id FROM event_categories
      WHERE facility_id = NEW.facility_id
      AND slug = CASE NEW.event_type
        WHEN 'open_play' THEN 'open-play'
        WHEN 'clinic' THEN 'clinics'
        WHEN 'tournament' THEN 'tournaments'
        WHEN 'league' THEN 'leagues'
        WHEN 'social' THEN 'social'
        ELSE 'open-play'
      END
      AND is_active = true
      LIMIT 1
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-assign category
DROP TRIGGER IF EXISTS trigger_assign_event_category ON event_series;
CREATE TRIGGER trigger_assign_event_category
  BEFORE INSERT OR UPDATE ON event_series
  FOR EACH ROW
  EXECUTE FUNCTION assign_event_category();

-- Comment
COMMENT ON TABLE event_categories IS 'Categories for organizing and filtering events (Clinics, Tournaments, etc.)';
