/*
  # Fix Social Comments Viewing for Authenticated Users
  
  This migration adds a policy to allow authenticated users to view comments on posts.
  Previously only anonymous users could view comments, which broke the social features.
  
  ## Changes:
  1. Add policy allowing authenticated users to view all comments
  
  ## Security:
  - Authenticated users can view all comments (matches the anonymous policy)
  - Users can only edit/delete their own comments (existing policies)
*/

-- Allow authenticated users to view comments
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'social_comments' 
    AND policyname = 'Authenticated users can view comments'
  ) THEN
    CREATE POLICY "Authenticated users can view comments"
      ON social_comments
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;
