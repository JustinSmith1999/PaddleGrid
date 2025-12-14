/*
  # Reviews and Ratings System

  1. New Tables
    - `facility_reviews`
      - `id` (uuid, primary key)
      - `facility_id` (uuid, references facilities)
      - `user_id` (uuid, references profiles)
      - `rating` (integer, 1-5)
      - `title` (text)
      - `review_text` (text)
      - `helpful_count` (integer)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `court_reviews`
      - `id` (uuid, primary key)
      - `court_id` (uuid, references courts)
      - `user_id` (uuid, references profiles)
      - `rating` (integer, 1-5)
      - `title` (text)
      - `review_text` (text)
      - `helpful_count` (integer)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `event_reviews`
      - `id` (uuid, primary key)
      - `event_id` (uuid, references event_series)
      - `user_id` (uuid, references profiles)
      - `rating` (integer, 1-5)
      - `title` (text)
      - `review_text` (text)
      - `helpful_count` (integer)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `review_helpfulness`
      - `id` (uuid, primary key)
      - `review_id` (uuid)
      - `review_type` (text: facility, court, event)
      - `user_id` (uuid, references profiles)
      - `is_helpful` (boolean)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all review tables
    - Users can create reviews for facilities/courts/events they've used
    - Users can read all reviews
    - Users can update/delete their own reviews
    - Users can mark reviews as helpful
*/

-- Facility Reviews Table
CREATE TABLE IF NOT EXISTS facility_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id uuid REFERENCES facilities(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title text NOT NULL,
  review_text text NOT NULL,
  helpful_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(facility_id, user_id)
);

-- Court Reviews Table
CREATE TABLE IF NOT EXISTS court_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  court_id uuid REFERENCES courts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title text NOT NULL,
  review_text text NOT NULL,
  helpful_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(court_id, user_id)
);

-- Event Reviews Table
CREATE TABLE IF NOT EXISTS event_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES event_series(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title text NOT NULL,
  review_text text NOT NULL,
  helpful_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(event_id, user_id)
);

-- Review Helpfulness Tracking
CREATE TABLE IF NOT EXISTS review_helpfulness (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid NOT NULL,
  review_type text NOT NULL CHECK (review_type IN ('facility', 'court', 'event')),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  is_helpful boolean NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(review_id, review_type, user_id)
);

-- Add average rating columns to facilities and courts
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS average_rating numeric(3,2) DEFAULT 0;
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS review_count integer DEFAULT 0;
ALTER TABLE courts ADD COLUMN IF NOT EXISTS average_rating numeric(3,2) DEFAULT 0;
ALTER TABLE courts ADD COLUMN IF NOT EXISTS review_count integer DEFAULT 0;
ALTER TABLE event_series ADD COLUMN IF NOT EXISTS average_rating numeric(3,2) DEFAULT 0;
ALTER TABLE event_series ADD COLUMN IF NOT EXISTS review_count integer DEFAULT 0;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_facility_reviews_facility ON facility_reviews(facility_id);
CREATE INDEX IF NOT EXISTS idx_facility_reviews_user ON facility_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_court_reviews_court ON court_reviews(court_id);
CREATE INDEX IF NOT EXISTS idx_court_reviews_user ON court_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_event_reviews_event ON event_reviews(event_id);
CREATE INDEX IF NOT EXISTS idx_event_reviews_user ON event_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_review_helpfulness_review ON review_helpfulness(review_id, review_type);

-- Enable RLS
ALTER TABLE facility_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE court_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_helpfulness ENABLE ROW LEVEL SECURITY;

-- Facility Reviews Policies
CREATE POLICY "Anyone can read facility reviews"
  ON facility_reviews FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create facility reviews"
  ON facility_reviews FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own facility reviews"
  ON facility_reviews FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own facility reviews"
  ON facility_reviews FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Court Reviews Policies
CREATE POLICY "Anyone can read court reviews"
  ON court_reviews FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create court reviews"
  ON court_reviews FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own court reviews"
  ON court_reviews FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own court reviews"
  ON court_reviews FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Event Reviews Policies
CREATE POLICY "Anyone can read event reviews"
  ON event_reviews FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create event reviews"
  ON event_reviews FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own event reviews"
  ON event_reviews FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own event reviews"
  ON event_reviews FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Review Helpfulness Policies
CREATE POLICY "Anyone can read review helpfulness"
  ON review_helpfulness FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can mark reviews helpful"
  ON review_helpfulness FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their helpfulness votes"
  ON review_helpfulness FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their helpfulness votes"
  ON review_helpfulness FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to update facility average rating
CREATE OR REPLACE FUNCTION update_facility_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE facilities
  SET 
    average_rating = (
      SELECT COALESCE(AVG(rating), 0)
      FROM facility_reviews
      WHERE facility_id = COALESCE(NEW.facility_id, OLD.facility_id)
    ),
    review_count = (
      SELECT COUNT(*)
      FROM facility_reviews
      WHERE facility_id = COALESCE(NEW.facility_id, OLD.facility_id)
    )
  WHERE id = COALESCE(NEW.facility_id, OLD.facility_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Function to update court average rating
CREATE OR REPLACE FUNCTION update_court_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE courts
  SET 
    average_rating = (
      SELECT COALESCE(AVG(rating), 0)
      FROM court_reviews
      WHERE court_id = COALESCE(NEW.court_id, OLD.court_id)
    ),
    review_count = (
      SELECT COUNT(*)
      FROM court_reviews
      WHERE court_id = COALESCE(NEW.court_id, OLD.court_id)
    )
  WHERE id = COALESCE(NEW.court_id, OLD.court_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Function to update event average rating
CREATE OR REPLACE FUNCTION update_event_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE event_series
  SET 
    average_rating = (
      SELECT COALESCE(AVG(rating), 0)
      FROM event_reviews
      WHERE event_id = COALESCE(NEW.event_id, OLD.event_id)
    ),
    review_count = (
      SELECT COUNT(*)
      FROM event_reviews
      WHERE event_id = COALESCE(NEW.event_id, OLD.event_id)
    )
  WHERE id = COALESCE(NEW.event_id, OLD.event_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Function to update review helpfulness count
CREATE OR REPLACE FUNCTION update_review_helpfulness_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.review_type = 'facility' THEN
    UPDATE facility_reviews
    SET helpful_count = (
      SELECT COUNT(*)
      FROM review_helpfulness
      WHERE review_id = NEW.review_id 
        AND review_type = 'facility'
        AND is_helpful = true
    )
    WHERE id = NEW.review_id;
  ELSIF NEW.review_type = 'court' THEN
    UPDATE court_reviews
    SET helpful_count = (
      SELECT COUNT(*)
      FROM review_helpfulness
      WHERE review_id = NEW.review_id 
        AND review_type = 'court'
        AND is_helpful = true
    )
    WHERE id = NEW.review_id;
  ELSIF NEW.review_type = 'event' THEN
    UPDATE event_reviews
    SET helpful_count = (
      SELECT COUNT(*)
      FROM review_helpfulness
      WHERE review_id = NEW.review_id 
        AND review_type = 'event'
        AND is_helpful = true
    )
    WHERE id = NEW.review_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for automatic rating updates
DROP TRIGGER IF EXISTS facility_review_rating_trigger ON facility_reviews;
CREATE TRIGGER facility_review_rating_trigger
  AFTER INSERT OR UPDATE OR DELETE ON facility_reviews
  FOR EACH ROW EXECUTE FUNCTION update_facility_rating();

DROP TRIGGER IF EXISTS court_review_rating_trigger ON court_reviews;
CREATE TRIGGER court_review_rating_trigger
  AFTER INSERT OR UPDATE OR DELETE ON court_reviews
  FOR EACH ROW EXECUTE FUNCTION update_court_rating();

DROP TRIGGER IF EXISTS event_review_rating_trigger ON event_reviews;
CREATE TRIGGER event_review_rating_trigger
  AFTER INSERT OR UPDATE OR DELETE ON event_reviews
  FOR EACH ROW EXECUTE FUNCTION update_event_rating();

DROP TRIGGER IF EXISTS review_helpfulness_trigger ON review_helpfulness;
CREATE TRIGGER review_helpfulness_trigger
  AFTER INSERT OR UPDATE ON review_helpfulness
  FOR EACH ROW EXECUTE FUNCTION update_review_helpfulness_count();
