/*
  # Add Missing RLS Policies (Fixed)
  
  This migration adds missing policies for tables where RLS was just enabled.
  These policies ensure proper functionality while maintaining security.
  
  ## New Policies Added:
  1. **social_comments** - Allow users to edit their own comments (uses author_id)
  2. **social_post_likes** - Allow anyone to like public posts (uses user_id)
  3. **activity_feed** - Allow users to manage their own activity feed (uses user_id)
  
  ## Security Model:
  - Users can only modify their own data
  - Public content is visible to anonymous users
  - Authenticated users have broader access
  - No sensitive data exposed
*/

-- social_comments: Allow users to update their own comments
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'social_comments' 
    AND policyname = 'Users can update own comments'
  ) THEN
    CREATE POLICY "Users can update own comments"
      ON social_comments
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = author_id)
      WITH CHECK (auth.uid() = author_id);
  END IF;
END $$;

-- social_comments: Allow authenticated users to create comments
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'social_comments' 
    AND policyname = 'Authenticated users can create comments'
  ) THEN
    CREATE POLICY "Authenticated users can create comments"
      ON social_comments
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = author_id);
  END IF;
END $$;

-- social_post_likes: Allow authenticated users to like posts
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'social_post_likes' 
    AND policyname = 'Users can like posts'
  ) THEN
    CREATE POLICY "Users can like posts"
      ON social_post_likes
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- social_post_likes: Allow users to unlike posts
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'social_post_likes' 
    AND policyname = 'Users can unlike posts'
  ) THEN
    CREATE POLICY "Users can unlike posts"
      ON social_post_likes
      FOR DELETE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- social_post_likes: Allow anyone to view likes on public posts
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'social_post_likes' 
    AND policyname = 'Anyone can view likes'
  ) THEN
    CREATE POLICY "Anyone can view likes"
      ON social_post_likes
      FOR SELECT
      TO anon, authenticated
      USING (true);
  END IF;
END $$;

-- activity_feed: Allow users to update their own activity
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'activity_feed' 
    AND policyname = 'Users can update own activities'
  ) THEN
    CREATE POLICY "Users can update own activities"
      ON activity_feed
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- activity_feed: Allow users to delete their own activity
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'activity_feed' 
    AND policyname = 'Users can delete own activities'
  ) THEN
    CREATE POLICY "Users can delete own activities"
      ON activity_feed
      FOR DELETE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;
