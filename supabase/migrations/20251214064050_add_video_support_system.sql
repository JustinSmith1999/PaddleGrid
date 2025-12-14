/*
  # Video Support System

  1. New Tables
    - `facility_videos`
      - `id` (uuid, primary key)
      - `facility_id` (uuid, references facilities)
      - `user_id` (uuid, references profiles)
      - `video_url` (text)
      - `thumbnail_url` (text)
      - `title` (text)
      - `description` (text)
      - `duration` (integer, in seconds)
      - `video_type` (text: tour, highlight, promo)
      - `views_count` (integer)
      - `created_at` (timestamp)
    
    - `match_videos`
      - `id` (uuid, primary key)
      - `match_id` (uuid, references dupr_matches)
      - `user_id` (uuid, references profiles)
      - `video_url` (text)
      - `thumbnail_url` (text)
      - `title` (text)
      - `description` (text)
      - `duration` (integer)
      - `views_count` (integer)
      - `created_at` (timestamp)

  2. Storage
    - Create storage bucket for videos
    - Create storage bucket for video thumbnails
    
  3. Updates
    - Add video fields to social_posts table
    - Add video_count to facilities

  4. Security
    - Enable RLS on all video tables
    - Public read access for facility videos
    - Only facility admins can upload facility videos
    - Match participants can upload match videos
*/

-- Facility Videos Table
CREATE TABLE IF NOT EXISTS facility_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id uuid REFERENCES facilities(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  video_url text NOT NULL,
  thumbnail_url text,
  title text NOT NULL,
  description text,
  duration integer DEFAULT 0,
  video_type text NOT NULL CHECK (video_type IN ('tour', 'highlight', 'promo', 'other')),
  views_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Match Videos Table
CREATE TABLE IF NOT EXISTS match_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid REFERENCES dupr_matches(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  video_url text NOT NULL,
  thumbnail_url text,
  title text NOT NULL,
  description text,
  duration integer DEFAULT 0,
  views_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Add video fields to social_posts if not exists
ALTER TABLE social_posts ADD COLUMN IF NOT EXISTS video_url text;
ALTER TABLE social_posts ADD COLUMN IF NOT EXISTS thumbnail_url text;
ALTER TABLE social_posts ADD COLUMN IF NOT EXISTS video_duration integer;

-- Add video count to facilities
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS video_count integer DEFAULT 0;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_facility_videos_facility ON facility_videos(facility_id);
CREATE INDEX IF NOT EXISTS idx_facility_videos_type ON facility_videos(video_type);
CREATE INDEX IF NOT EXISTS idx_match_videos_match ON match_videos(match_id);
CREATE INDEX IF NOT EXISTS idx_social_posts_video ON social_posts(video_url) WHERE video_url IS NOT NULL;

-- Enable RLS
ALTER TABLE facility_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_videos ENABLE ROW LEVEL SECURITY;

-- Facility Videos Policies
CREATE POLICY "Anyone can view facility videos"
  ON facility_videos FOR SELECT
  USING (true);

CREATE POLICY "Facility admins can upload videos"
  ON facility_videos FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM facility_users
      WHERE facility_users.facility_id = facility_videos.facility_id
        AND facility_users.user_id = auth.uid()
        AND facility_users.role IN ('admin', 'owner')
    )
  );

CREATE POLICY "Facility admins can update their facility videos"
  ON facility_videos FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM facility_users
      WHERE facility_users.facility_id = facility_videos.facility_id
        AND facility_users.user_id = auth.uid()
        AND facility_users.role IN ('admin', 'owner')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM facility_users
      WHERE facility_users.facility_id = facility_videos.facility_id
        AND facility_users.user_id = auth.uid()
        AND facility_users.role IN ('admin', 'owner')
    )
  );

CREATE POLICY "Facility admins can delete their facility videos"
  ON facility_videos FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM facility_users
      WHERE facility_users.facility_id = facility_videos.facility_id
        AND facility_users.user_id = auth.uid()
        AND facility_users.role IN ('admin', 'owner')
    )
  );

-- Match Videos Policies
CREATE POLICY "Anyone can view match videos"
  ON match_videos FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can upload match videos"
  ON match_videos FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own match videos"
  ON match_videos FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own match videos"
  ON match_videos FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to update facility video count
CREATE OR REPLACE FUNCTION update_facility_video_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE facilities
  SET video_count = (
    SELECT COUNT(*)
    FROM facility_videos
    WHERE facility_id = COALESCE(NEW.facility_id, OLD.facility_id)
  )
  WHERE id = COALESCE(NEW.facility_id, OLD.facility_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger for facility video count
DROP TRIGGER IF EXISTS facility_video_count_trigger ON facility_videos;
CREATE TRIGGER facility_video_count_trigger
  AFTER INSERT OR DELETE ON facility_videos
  FOR EACH ROW EXECUTE FUNCTION update_facility_video_count();

-- Function to increment video view count
CREATE OR REPLACE FUNCTION increment_video_views(
  video_id uuid,
  video_table text
)
RETURNS void AS $$
BEGIN
  IF video_table = 'facility_videos' THEN
    UPDATE facility_videos SET views_count = views_count + 1 WHERE id = video_id;
  ELSIF video_table = 'match_videos' THEN
    UPDATE match_videos SET views_count = views_count + 1 WHERE id = video_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Storage buckets setup (will be created via Supabase dashboard or separate storage operation)
-- Bucket: videos (for all video uploads)
-- Bucket: video-thumbnails (for video thumbnails)

-- Note: Storage bucket policies need to be set up separately through Supabase storage API
-- Allow authenticated users to upload to videos bucket
-- Allow public read access to videos bucket
-- Allow authenticated users to upload to video-thumbnails bucket
-- Allow public read access to video-thumbnails bucket
