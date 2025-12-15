/*
  # Stories System
  
  1. New Tables
    - `stories`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to profiles)
      - `facility_id` (uuid, foreign key to facilities, optional)
      - `media_url` (text, required) - Image or video URL
      - `media_type` (text) - 'image' or 'video'
      - `caption` (text, optional)
      - `created_at` (timestamptz)
      - `expires_at` (timestamptz) - Stories expire after 24 hours
    
    - `story_views`
      - `id` (uuid, primary key)
      - `story_id` (uuid, foreign key to stories)
      - `viewer_id` (uuid, foreign key to profiles)
      - `viewed_at` (timestamptz)
      
  2. Security
    - Enable RLS on both tables
    - Users can create their own stories
    - Users can view stories from users they follow and public facilities
    - Story owners can see who viewed their stories
*/

-- Create stories table
CREATE TABLE IF NOT EXISTS stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  facility_id uuid REFERENCES facilities(id) ON DELETE CASCADE,
  media_url text NOT NULL,
  media_type text NOT NULL DEFAULT 'image',
  caption text,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '24 hours'),
  CONSTRAINT valid_media_type CHECK (media_type IN ('image', 'video')),
  CONSTRAINT has_owner CHECK (user_id IS NOT NULL OR facility_id IS NOT NULL)
);

-- Create story_views table
CREATE TABLE IF NOT EXISTS story_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid REFERENCES stories(id) ON DELETE CASCADE NOT NULL,
  viewer_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  viewed_at timestamptz DEFAULT now(),
  UNIQUE(story_id, viewer_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_stories_user_id ON stories(user_id);
CREATE INDEX IF NOT EXISTS idx_stories_facility_id ON stories(facility_id);
CREATE INDEX IF NOT EXISTS idx_stories_expires_at ON stories(expires_at);
CREATE INDEX IF NOT EXISTS idx_story_views_story_id ON story_views(story_id);
CREATE INDEX IF NOT EXISTS idx_story_views_viewer_id ON story_views(viewer_id);

-- Enable RLS
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_views ENABLE ROW LEVEL SECURITY;

-- Stories policies
CREATE POLICY "Users can create own stories"
  ON stories FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Facilities can create stories"
  ON stories FOR INSERT
  TO authenticated
  WITH CHECK (
    facility_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM facility_users
      WHERE facility_users.facility_id = stories.facility_id
      AND facility_users.user_id = auth.uid()
      AND facility_users.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Users can view unexpired stories from followed users"
  ON stories FOR SELECT
  TO authenticated
  USING (
    expires_at > now() AND
    (
      user_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM social_follows
        WHERE social_follows.follower_id = auth.uid()
        AND social_follows.following_id = stories.user_id
      ) OR
      facility_id IS NOT NULL
    )
  );

CREATE POLICY "Anyone can view facility stories"
  ON stories FOR SELECT
  TO anon
  USING (expires_at > now() AND facility_id IS NOT NULL);

CREATE POLICY "Users can delete own stories"
  ON stories FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Story views policies
CREATE POLICY "Users can record story views"
  ON story_views FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = viewer_id);

CREATE POLICY "Users can view their own view history"
  ON story_views FOR SELECT
  TO authenticated
  USING (auth.uid() = viewer_id);

CREATE POLICY "Story owners can see who viewed"
  ON story_views FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM stories
      WHERE stories.id = story_views.story_id
      AND stories.user_id = auth.uid()
    )
  );

-- Function to clean up expired stories (can be called by a cron job)
CREATE OR REPLACE FUNCTION cleanup_expired_stories()
RETURNS void AS $$
BEGIN
  DELETE FROM stories WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
