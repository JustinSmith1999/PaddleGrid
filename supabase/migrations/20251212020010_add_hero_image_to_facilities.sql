/*
  # Add Hero Image to Facilities

  1. Changes
    - Add `hero_image_url` column to `facilities` table to store custom hero background images for club pages
  
  2. Security
    - No RLS changes needed as existing policies cover this column
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'facilities' AND column_name = 'hero_image_url'
  ) THEN
    ALTER TABLE facilities ADD COLUMN hero_image_url text;
  END IF;
END $$;