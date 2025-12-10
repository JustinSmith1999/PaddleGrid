/*
  # Add Court Reference to Social Posts

  1. Changes
    - Add `court_id` column to `social_posts` table
    - Links posts to specific courts at facilities
    - Allows match invites to specify exact court location
  
  2. Benefits
    - Users can select actual courts from their facility
    - Posts show real court names instead of generic references
    - Better coordination for match planning
*/

-- Add court_id column to social_posts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'social_posts' AND column_name = 'court_id'
  ) THEN
    ALTER TABLE social_posts ADD COLUMN court_id uuid REFERENCES courts(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_social_posts_court ON social_posts(court_id);