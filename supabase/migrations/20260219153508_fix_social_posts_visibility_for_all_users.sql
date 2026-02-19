/*
  # Fix Social Posts Visibility

  This migration fixes the visibility of social posts so authenticated users can see all posts
  regardless of visibility settings, and anonymous users can see public posts.

  ## Changes
  1. Drop overly restrictive policy for authenticated users
  2. Create a simpler policy that allows authenticated users to see all non-archived posts
  3. Keep the anonymous user policy for public posts only

  ## Security
  - Authenticated users can view all posts (standard social media behavior)
  - Anonymous users can only view public posts
  - Other policies for create/update/delete remain unchanged
*/

-- Drop the overly complex authenticated user viewing policy
DROP POLICY IF EXISTS "Users can view posts based on visibility" ON social_posts;

-- Create a simple policy for authenticated users to view all non-archived posts
CREATE POLICY "Authenticated users can view all posts"
  ON social_posts FOR SELECT
  TO authenticated
  USING (is_archived = false);

-- Ensure anonymous users can still view public posts (already exists, but recreating for clarity)
DROP POLICY IF EXISTS "Anyone can view public posts" ON social_posts;

CREATE POLICY "Anyone can view public posts"
  ON social_posts FOR SELECT
  TO anon
  USING (is_archived = false AND visibility = 'public');
