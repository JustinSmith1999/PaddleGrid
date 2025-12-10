/*
  # Add Media Support to Social Posts

  1. Changes
    - Add `media_urls` column to social_posts table
    - Array of text URLs for images/videos
    - Allows posts to include media content

  2. Notes
    - Using text array to store multiple media URLs
    - URLs can point to Pexels, uploaded images, or other sources
*/

-- Add media_urls column to social_posts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'social_posts' AND column_name = 'media_urls'
  ) THEN
    ALTER TABLE social_posts ADD COLUMN media_urls text[] DEFAULT '{}';
  END IF;
END $$;
