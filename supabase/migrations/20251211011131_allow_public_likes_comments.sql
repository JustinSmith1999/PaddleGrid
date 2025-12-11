/*
  # Allow Public Access to Likes and Comments

  1. Changes
    - Add public/anonymous SELECT policies for social_post_likes
    - Add public/anonymous SELECT policies for social_comments
    - Allow EVERYONE (authenticated and anonymous users) to view likes and comments

  2. Security
    - Only SELECT operations are allowed for anonymous users
    - INSERT, UPDATE, DELETE still require authentication
    - Users must still be authenticated to create, edit, or delete likes and comments
*/

-- Drop existing authenticated-only policies
DROP POLICY IF EXISTS "Users can view likes" ON social_post_likes;
DROP POLICY IF EXISTS "Users can view comments on visible posts" ON social_comments;

-- Allow EVERYONE (authenticated and anonymous) to view likes
CREATE POLICY "Everyone can view likes"
  ON social_post_likes FOR SELECT
  USING (true);

-- Allow EVERYONE (authenticated and anonymous) to view comments
CREATE POLICY "Everyone can view comments"
  ON social_comments FOR SELECT
  USING (true);