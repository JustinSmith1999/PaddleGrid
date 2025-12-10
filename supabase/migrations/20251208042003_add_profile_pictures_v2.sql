/*
  # Add Profile Pictures Support

  1. Changes
    - Add `profile_picture_url` column to `profiles` table
    - Create storage bucket for profile pictures
    - Set up RLS policies for profile picture uploads

  2. Security
    - Users can upload their own profile pictures
    - Profile pictures are publicly readable
    - Users can only delete their own profile pictures
*/

-- Add profile_picture_url to profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'profile_picture_url'
  ) THEN
    ALTER TABLE profiles 
    ADD COLUMN profile_picture_url text;
  END IF;
END $$;

-- Create storage bucket for profile pictures
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-pictures', 'profile-pictures', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist and recreate
DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can upload own profile picture" ON storage.objects;
  DROP POLICY IF EXISTS "Users can update own profile picture" ON storage.objects;
  DROP POLICY IF EXISTS "Users can delete own profile picture" ON storage.objects;
  DROP POLICY IF EXISTS "Profile pictures are publicly readable" ON storage.objects;
END $$;

-- Allow authenticated users to upload their own profile pictures
CREATE POLICY "Users can upload own profile picture"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-pictures' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to update their own profile pictures
CREATE POLICY "Users can update own profile picture"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profile-pictures' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'profile-pictures' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own profile pictures
CREATE POLICY "Users can delete own profile picture"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'profile-pictures' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public read access to profile pictures
CREATE POLICY "Profile pictures are publicly readable"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'profile-pictures');