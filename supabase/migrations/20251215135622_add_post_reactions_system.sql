/*
  # Add Post Reactions System

  1. New Tables
    - `post_reactions`
      - `id` (uuid, primary key)
      - `post_id` (uuid, references social_posts)
      - `user_id` (uuid, references profiles)
      - `reaction_type` (text) - 'like', 'fire', 'strong', 'ace', 'funny'
      - `created_at` (timestamptz)
      - Unique constraint on (post_id, user_id) - one reaction per user per post

  2. Security
    - Enable RLS on `post_reactions` table
    - Add policies for authenticated users to:
      - View all reactions
      - Add their own reactions
      - Delete their own reactions

  3. Notes
    - Supports multiple reaction types: like ❤️, fire 🔥, strong 💪, ace 🎾, funny 😂
    - Users can only have one reaction per post (can change reaction type)
*/

-- Create post_reactions table
CREATE TABLE IF NOT EXISTS post_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES social_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reaction_type text NOT NULL CHECK (reaction_type IN ('like', 'fire', 'strong', 'ace', 'funny')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_post_reactions_post_id ON post_reactions(post_id);
CREATE INDEX IF NOT EXISTS idx_post_reactions_user_id ON post_reactions(user_id);

-- Enable RLS
ALTER TABLE post_reactions ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view reactions
CREATE POLICY "Anyone can view reactions"
  ON post_reactions FOR SELECT
  USING (true);

-- Policy: Authenticated users can add reactions
CREATE POLICY "Authenticated users can add reactions"
  ON post_reactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own reactions
CREATE POLICY "Users can delete own reactions"
  ON post_reactions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Users can update their own reactions (to change reaction type)
CREATE POLICY "Users can update own reactions"
  ON post_reactions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Function to get reaction counts for a post
CREATE OR REPLACE FUNCTION get_post_reaction_counts(post_uuid uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    SELECT jsonb_object_agg(reaction_type, count)
    FROM (
      SELECT reaction_type, COUNT(*)::int as count
      FROM post_reactions
      WHERE post_id = post_uuid
      GROUP BY reaction_type
    ) counts
  );
END;
$$;