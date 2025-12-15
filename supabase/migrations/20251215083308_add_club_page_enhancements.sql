/*
  # Club Page Enhancements Schema
  
  1. New Tables
    - `facility_amenities`
      - Links facilities to their amenities/features
      - Includes icon, name, category for grouping
    - `facility_gallery`
      - Stores multiple photos for each facility
      - Supports different image types (interior, exterior, courts, events, etc.)
    - `facility_testimonials`
      - Member reviews and testimonials
      - Star ratings, member info, date
    - `court_images`
      - Photo URLs for individual courts
    - `facility_operating_hours`
      - Detailed operating hours by day
      - Peak/off-peak designation
    - `facility_activity_heatmap`
      - Tracks booking patterns for busiest times visualization
      
  2. Security
    - Enable RLS on all new tables
    - Public read access for browsing
    - Write access restricted to facility admins
*/

-- Create amenities table
CREATE TABLE IF NOT EXISTS facility_amenities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id uuid REFERENCES facilities(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  icon text NOT NULL,
  category text NOT NULL,
  display_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_facility_amenities_facility ON facility_amenities(facility_id);
CREATE INDEX IF NOT EXISTS idx_facility_amenities_category ON facility_amenities(category);

ALTER TABLE facility_amenities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view amenities"
  ON facility_amenities FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Facility admins can manage amenities"
  ON facility_amenities FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM facility_users
      WHERE facility_users.facility_id = facility_amenities.facility_id
      AND facility_users.user_id = auth.uid()
      AND facility_users.role IN ('admin', 'owner')
    )
  );

-- Create gallery table
CREATE TABLE IF NOT EXISTS facility_gallery (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id uuid REFERENCES facilities(id) ON DELETE CASCADE NOT NULL,
  image_url text NOT NULL,
  image_type text NOT NULL,
  caption text,
  display_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_facility_gallery_facility ON facility_gallery(facility_id);
CREATE INDEX IF NOT EXISTS idx_facility_gallery_type ON facility_gallery(image_type);

ALTER TABLE facility_gallery ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view gallery"
  ON facility_gallery FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Facility admins can manage gallery"
  ON facility_gallery FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM facility_users
      WHERE facility_users.facility_id = facility_gallery.facility_id
      AND facility_users.user_id = auth.uid()
      AND facility_users.role IN ('admin', 'owner')
    )
  );

-- Create testimonials table
CREATE TABLE IF NOT EXISTS facility_testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id uuid REFERENCES facilities(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  rating int NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text NOT NULL,
  is_featured boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_facility_testimonials_facility ON facility_testimonials(facility_id);
CREATE INDEX IF NOT EXISTS idx_facility_testimonials_user ON facility_testimonials(user_id);
CREATE INDEX IF NOT EXISTS idx_facility_testimonials_featured ON facility_testimonials(is_featured) WHERE is_featured = true;

ALTER TABLE facility_testimonials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view testimonials"
  ON facility_testimonials FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can create their own testimonials"
  ON facility_testimonials FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own testimonials"
  ON facility_testimonials FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Facility admins can manage testimonials"
  ON facility_testimonials FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM facility_users
      WHERE facility_users.facility_id = facility_testimonials.facility_id
      AND facility_users.user_id = auth.uid()
      AND facility_users.role IN ('admin', 'owner')
    )
  );

-- Add court images column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'courts' AND column_name = 'image_url'
  ) THEN
    ALTER TABLE courts ADD COLUMN image_url text;
  END IF;
END $$;

-- Create operating hours table with detailed scheduling
CREATE TABLE IF NOT EXISTS facility_operating_hours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id uuid REFERENCES facilities(id) ON DELETE CASCADE NOT NULL,
  day_of_week int NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  open_time time NOT NULL,
  close_time time NOT NULL,
  is_peak_hours boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_facility_hours_facility ON facility_operating_hours(facility_id);
CREATE INDEX IF NOT EXISTS idx_facility_hours_day ON facility_operating_hours(day_of_week);

ALTER TABLE facility_operating_hours ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view operating hours"
  ON facility_operating_hours FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Facility admins can manage hours"
  ON facility_operating_hours FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM facility_users
      WHERE facility_users.facility_id = facility_operating_hours.facility_id
      AND facility_users.user_id = auth.uid()
      AND facility_users.role IN ('admin', 'owner')
    )
  );

-- Create activity heatmap table
CREATE TABLE IF NOT EXISTS facility_activity_heatmap (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id uuid REFERENCES facilities(id) ON DELETE CASCADE NOT NULL,
  day_of_week int NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  hour_of_day int NOT NULL CHECK (hour_of_day >= 0 AND hour_of_day <= 23),
  booking_count int DEFAULT 0,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(facility_id, day_of_week, hour_of_day)
);

CREATE INDEX IF NOT EXISTS idx_activity_heatmap_facility ON facility_activity_heatmap(facility_id);

ALTER TABLE facility_activity_heatmap ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view activity heatmap"
  ON facility_activity_heatmap FOR SELECT
  TO public
  USING (true);

-- Function to update activity heatmap when bookings are created
CREATE OR REPLACE FUNCTION update_facility_activity_heatmap()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO facility_activity_heatmap (facility_id, day_of_week, hour_of_day, booking_count)
    SELECT 
      c.facility_id,
      EXTRACT(DOW FROM NEW.booking_date)::int,
      EXTRACT(HOUR FROM NEW.start_time::time)::int,
      1
    FROM courts c
    WHERE c.id = NEW.court_id
    ON CONFLICT (facility_id, day_of_week, hour_of_day)
    DO UPDATE SET 
      booking_count = facility_activity_heatmap.booking_count + 1,
      updated_at = now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_update_activity_heatmap ON bookings;
CREATE TRIGGER trigger_update_activity_heatmap
  AFTER INSERT ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_facility_activity_heatmap();

-- Insert sample amenities for Pickleball Heaven
INSERT INTO facility_amenities (facility_id, name, icon, category, display_order)
SELECT 
  f.id,
  amenity.name,
  amenity.icon,
  amenity.category,
  amenity.display_order
FROM facilities f
CROSS JOIN (
  VALUES
    ('Free Parking', 'parking-square', 'parking', 1),
    ('WiFi Available', 'wifi', 'connectivity', 2),
    ('Pro Shop', 'shopping-bag', 'amenities', 3),
    ('Locker Rooms', 'door-closed', 'facilities', 4),
    ('Showers', 'droplet', 'facilities', 5),
    ('Food & Beverage', 'utensils', 'amenities', 6),
    ('Equipment Rental', 'package', 'services', 7),
    ('Private Lessons', 'user-circle', 'services', 8),
    ('Tournaments', 'trophy', 'activities', 9),
    ('Outdoor Courts', 'sun', 'courts', 10),
    ('Indoor Courts', 'home', 'courts', 11),
    ('Lighting', 'lightbulb', 'courts', 12)
) AS amenity(name, icon, category, display_order)
WHERE f.name = 'Pickleball Heaven'
ON CONFLICT DO NOTHING;

-- Insert sample gallery images
INSERT INTO facility_gallery (facility_id, image_url, image_type, caption, display_order)
SELECT 
  f.id,
  gallery.image_url,
  gallery.image_type,
  gallery.caption,
  gallery.display_order
FROM facilities f
CROSS JOIN (
  VALUES
    ('https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800', 'courts', 'Professional grade courts', 1),
    ('https://images.unsplash.com/photo-1622163642998-1ea32b0bbc67?w=800', 'courts', 'Indoor climate-controlled courts', 2),
    ('https://images.unsplash.com/photo-1519311965067-36d3e5f33d39?w=800', 'facility', 'Modern clubhouse', 3),
    ('https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800', 'events', 'Tournament action', 4),
    ('https://images.unsplash.com/photo-1434682772747-f16d3ea162c3?w=800', 'facility', 'Pro shop and lounge', 5),
    ('https://images.unsplash.com/photo-1606889464198-fcb18894cf50?w=800', 'exterior', 'Facility exterior', 6)
) AS gallery(image_url, image_type, caption, display_order)
WHERE f.name = 'Pickleball Heaven'
ON CONFLICT DO NOTHING;

-- Insert sample testimonials
INSERT INTO facility_testimonials (facility_id, user_id, rating, comment, is_featured)
SELECT 
  f.id,
  p.id,
  testimonial.rating,
  testimonial.comment,
  testimonial.is_featured
FROM facilities f
CROSS JOIN profiles p
CROSS JOIN (
  VALUES
    (5, 'Best pickleball facility in the area! Great courts, friendly staff, and a welcoming community. I play here 3 times a week!', true),
    (5, 'The courts are always well-maintained and the booking system makes it so easy to reserve court time. Highly recommend!', true),
    (4, 'Love the atmosphere here. Met so many great players and the tournaments are super fun. Only wish they had longer hours!', false),
    (5, 'Amazing facility with top-notch equipment. The pro shop has everything you need and the staff is incredibly helpful.', true)
) AS testimonial(rating, comment, is_featured)
WHERE f.name = 'Pickleball Heaven'
LIMIT 4
ON CONFLICT DO NOTHING;
