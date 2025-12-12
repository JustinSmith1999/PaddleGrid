/*
  # Add Link Preview Support to Social Posts

  1. Changes
    - Add `link_preview` JSONB column to `social_posts` table to store Open Graph metadata
    - The column stores structured data including:
      - url: The URL being previewed
      - title: Open Graph title
      - description: Open Graph description
      - image: Open Graph image URL
      - siteName: Name of the site
      - videoId: YouTube video ID (if applicable)

  2. Notes
    - Uses JSONB for flexible schema
    - Nullable field - only populated when a URL is detected in the post
    - Enables rich link previews in the social feed
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'social_posts' AND column_name = 'link_preview'
  ) THEN
    ALTER TABLE social_posts ADD COLUMN link_preview JSONB;
  END IF;
END $$;
