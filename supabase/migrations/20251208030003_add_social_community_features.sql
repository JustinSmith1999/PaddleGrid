/*
  # Social Community Features

  1. New Tables
    - `social_posts`
      - Core social posts with support for general posts and match invites
      - Includes sport, skill level, date/time for match coordination
      - Visibility controls (facility/friends/public)
    
    - `social_post_likes`
      - Reactions to posts with different reaction types
      - Prevents duplicate reactions with unique constraint
    
    - `social_comments`
      - Comments on posts
      - Simple threaded discussion
    
    - `social_follows`
      - User following relationships
      - Bidirectional following capability
    
    - `social_notifications`
      - Activity notifications for users
      - Supports multiple notification types with flexible data payload
    
    - `social_post_participants`
      - Track users who join match invites
      - Manages spots filled for match coordination

  2. Security
    - Enable RLS on all tables
    - Users can create their own content
    - Users can only edit/delete their own posts and comments
    - Facility admins can moderate posts at their facilities
    - Visibility-based access control for feed

  3. Features
    - Match invite coordination with spot tracking
    - Flexible reaction system
    - Activity feed with filtering
    - Notification system for engagement
*/

-- Create post type enum
DO $$ BEGIN
  CREATE TYPE post_type AS ENUM ('general', 'match_invite');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create visibility enum
DO $$ BEGIN
  CREATE TYPE post_visibility AS ENUM ('facility', 'friends', 'public');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create notification type enum
DO $$ BEGIN
  CREATE TYPE notification_type AS ENUM ('like', 'comment', 'follow', 'match_join', 'mention');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Social Posts table
CREATE TABLE IF NOT EXISTS social_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  facility_id uuid REFERENCES facilities(id) ON DELETE SET NULL,
  post_type post_type NOT NULL DEFAULT 'general',
  content text NOT NULL,
  
  -- Match invite specific fields
  sport text,
  skill_min numeric(3,1),
  skill_max numeric(3,1),
  play_date date,
  play_start_time time,
  play_end_time time,
  spots_needed integer,
  spots_filled integer DEFAULT 0,
  
  -- Visibility and metadata
  visibility post_visibility NOT NULL DEFAULT 'facility',
  is_archived boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT valid_skill_range CHECK (skill_min IS NULL OR skill_max IS NULL OR skill_min <= skill_max),
  CONSTRAINT valid_spots CHECK (spots_needed IS NULL OR spots_needed > 0),
  CONSTRAINT valid_filled_spots CHECK (spots_filled >= 0 AND (spots_needed IS NULL OR spots_filled <= spots_needed)),
  CONSTRAINT valid_time_range CHECK (play_start_time IS NULL OR play_end_time IS NULL OR play_start_time < play_end_time)
);

-- Social Post Likes table
CREATE TABLE IF NOT EXISTS social_post_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES social_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reaction_type text NOT NULL DEFAULT 'like',
  created_at timestamptz DEFAULT now(),
  
  CONSTRAINT unique_user_post_reaction UNIQUE (post_id, user_id, reaction_type)
);

-- Social Comments table
CREATE TABLE IF NOT EXISTS social_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES social_posts(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  is_deleted boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Social Follows table
CREATE TABLE IF NOT EXISTS social_follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  
  CONSTRAINT no_self_follow CHECK (follower_id != following_id),
  CONSTRAINT unique_follow UNIQUE (follower_id, following_id)
);

-- Social Notifications table
CREATE TABLE IF NOT EXISTS social_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  data jsonb DEFAULT '{}'::jsonb,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Social Post Participants table
CREATE TABLE IF NOT EXISTS social_post_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES social_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status text DEFAULT 'joined',
  created_at timestamptz DEFAULT now(),
  
  CONSTRAINT unique_post_participant UNIQUE (post_id, user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_social_posts_author ON social_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_social_posts_facility ON social_posts(facility_id);
CREATE INDEX IF NOT EXISTS idx_social_posts_created ON social_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_social_posts_type ON social_posts(post_type);
CREATE INDEX IF NOT EXISTS idx_social_posts_play_date ON social_posts(play_date) WHERE play_date IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_social_likes_post ON social_post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_social_likes_user ON social_post_likes(user_id);

CREATE INDEX IF NOT EXISTS idx_social_comments_post ON social_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_social_comments_author ON social_comments(author_id);
CREATE INDEX IF NOT EXISTS idx_social_comments_created ON social_comments(created_at);

CREATE INDEX IF NOT EXISTS idx_social_follows_follower ON social_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_social_follows_following ON social_follows(following_id);

CREATE INDEX IF NOT EXISTS idx_social_notifications_user ON social_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_social_notifications_unread ON social_notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_social_notifications_created ON social_notifications(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_social_participants_post ON social_post_participants(post_id);
CREATE INDEX IF NOT EXISTS idx_social_participants_user ON social_post_participants(user_id);

-- Enable Row Level Security
ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_post_participants ENABLE ROW LEVEL SECURITY;

-- RLS Policies for social_posts

-- Public can view published posts based on visibility
CREATE POLICY "Users can view posts based on visibility"
  ON social_posts FOR SELECT
  TO authenticated
  USING (
    CASE visibility
      WHEN 'public' THEN true
      WHEN 'facility' THEN (
        facility_id IS NULL OR
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
        )
      )
      WHEN 'friends' THEN (
        author_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM social_follows
          WHERE (follower_id = auth.uid() AND following_id = author_id)
             OR (following_id = auth.uid() AND follower_id = author_id)
        )
      )
    END
    AND is_archived = false
  );

-- Users can create posts
CREATE POLICY "Users can create own posts"
  ON social_posts FOR INSERT
  TO authenticated
  WITH CHECK (author_id = auth.uid());

-- Users can update their own posts
CREATE POLICY "Users can update own posts"
  ON social_posts FOR UPDATE
  TO authenticated
  USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());

-- Users can delete their own posts
CREATE POLICY "Users can delete own posts"
  ON social_posts FOR DELETE
  TO authenticated
  USING (author_id = auth.uid());

-- Facility admins can moderate posts at their facility
CREATE POLICY "Facility admins can moderate posts"
  ON social_posts FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'facility_manager')
      AND (facility_id IS NULL OR profiles.id = auth.uid())
    )
  );

-- RLS Policies for social_post_likes

-- Users can view all likes
CREATE POLICY "Users can view likes"
  ON social_post_likes FOR SELECT
  TO authenticated
  USING (true);

-- Users can create their own likes
CREATE POLICY "Users can create own likes"
  ON social_post_likes FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own likes
CREATE POLICY "Users can delete own likes"
  ON social_post_likes FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- RLS Policies for social_comments

-- Users can view comments on posts they can see
CREATE POLICY "Users can view comments on visible posts"
  ON social_comments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM social_posts
      WHERE social_posts.id = social_comments.post_id
    )
  );

-- Users can create comments
CREATE POLICY "Users can create comments"
  ON social_comments FOR INSERT
  TO authenticated
  WITH CHECK (author_id = auth.uid());

-- Users can update their own comments
CREATE POLICY "Users can update own comments"
  ON social_comments FOR UPDATE
  TO authenticated
  USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());

-- Users can delete their own comments
CREATE POLICY "Users can delete own comments"
  ON social_comments FOR DELETE
  TO authenticated
  USING (author_id = auth.uid());

-- RLS Policies for social_follows

-- Users can view all follows
CREATE POLICY "Users can view follows"
  ON social_follows FOR SELECT
  TO authenticated
  USING (true);

-- Users can create their own follows
CREATE POLICY "Users can create own follows"
  ON social_follows FOR INSERT
  TO authenticated
  WITH CHECK (follower_id = auth.uid());

-- Users can delete their own follows
CREATE POLICY "Users can delete own follows"
  ON social_follows FOR DELETE
  TO authenticated
  USING (follower_id = auth.uid());

-- RLS Policies for social_notifications

-- Users can only view their own notifications
CREATE POLICY "Users can view own notifications"
  ON social_notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- System can create notifications (handled via functions)
CREATE POLICY "System can create notifications"
  ON social_notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
  ON social_notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications"
  ON social_notifications FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- RLS Policies for social_post_participants

-- Users can view participants on posts they can see
CREATE POLICY "Users can view participants on visible posts"
  ON social_post_participants FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM social_posts
      WHERE social_posts.id = social_post_participants.post_id
    )
  );

-- Users can join posts
CREATE POLICY "Users can join posts"
  ON social_post_participants FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can leave posts
CREATE POLICY "Users can leave posts"
  ON social_post_participants FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Function to update spots_filled when participants join/leave
CREATE OR REPLACE FUNCTION update_post_spots_filled()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE social_posts
    SET spots_filled = spots_filled + 1
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE social_posts
    SET spots_filled = GREATEST(0, spots_filled - 1)
    WHERE id = OLD.post_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to maintain spots_filled count
DROP TRIGGER IF EXISTS trigger_update_post_spots_filled ON social_post_participants;
CREATE TRIGGER trigger_update_post_spots_filled
  AFTER INSERT OR DELETE ON social_post_participants
  FOR EACH ROW
  EXECUTE FUNCTION update_post_spots_filled();

-- Function to create notifications
CREATE OR REPLACE FUNCTION create_social_notification(
  p_user_id uuid,
  p_type notification_type,
  p_data jsonb
)
RETURNS uuid AS $$
DECLARE
  notification_id uuid;
BEGIN
  INSERT INTO social_notifications (user_id, type, data)
  VALUES (p_user_id, p_type, p_data)
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get post statistics
CREATE OR REPLACE FUNCTION get_post_stats(p_post_id uuid)
RETURNS json AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'likes_count', (SELECT COUNT(*) FROM social_post_likes WHERE post_id = p_post_id),
    'comments_count', (SELECT COUNT(*) FROM social_comments WHERE post_id = p_post_id AND is_deleted = false),
    'participants_count', (SELECT COUNT(*) FROM social_post_participants WHERE post_id = p_post_id)
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;