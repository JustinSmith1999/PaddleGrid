/*
  # Add Anon Access to Social Posts
  
  Allow anonymous (not logged in) users to view public social posts.
  This ensures the community feed is visible to all visitors.
  
  ## Changes
  
  - Add anon role policy to view public posts
  - Add anon access to related tables (likes, comments, participants)
*/

-- Allow anon users to view public posts
CREATE POLICY "Anyone can view public posts"
  ON social_posts FOR SELECT
  TO anon
  USING (
    is_archived = false
    AND visibility = 'public'
  );

-- Allow anon users to view post likes count
CREATE POLICY "Anyone can view post likes"
  ON social_post_likes FOR SELECT
  TO anon
  USING (true);

-- Allow anon users to view comments on public posts
CREATE POLICY "Anyone can view comments on public posts"
  ON social_comments FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM social_posts
      WHERE social_posts.id = social_comments.post_id
      AND social_posts.visibility = 'public'
      AND social_posts.is_archived = false
    )
  );

-- Allow anon users to view participants on public posts
CREATE POLICY "Anyone can view participants on public posts"
  ON social_post_participants FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM social_posts
      WHERE social_posts.id = social_post_participants.post_id
      AND social_posts.visibility = 'public'
      AND social_posts.is_archived = false
    )
  );

-- Allow anon users to view public profiles (needed for post authors)
CREATE POLICY "Anyone can view public profile info"
  ON profiles FOR SELECT
  TO anon
  USING (true);