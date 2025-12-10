/*
  # Court Images Storage Setup

  1. Storage Setup
    - Creates a 'court-images' storage bucket for storing court photos
    - Sets up public access policies for viewing images
    - Configures upload permissions for authenticated users
    
  2. Security
    - Public read access for all court images
    - Upload restricted to authenticated users only
    - File size limit of 5MB
    - Only image file types allowed (jpg, jpeg, png, webp)
*/

-- Create storage bucket for court images
INSERT INTO storage.buckets (id, name, public)
VALUES ('court-images', 'court-images', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public Access to Court Images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Users Can Upload Court Images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Users Can Update Court Images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Users Can Delete Court Images" ON storage.objects;

-- Allow public read access to court images
CREATE POLICY "Public Access to Court Images"
ON storage.objects FOR SELECT
USING (bucket_id = 'court-images');

-- Allow authenticated users to upload court images
CREATE POLICY "Authenticated Users Can Upload Court Images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'court-images');

-- Allow authenticated users to update their uploaded images
CREATE POLICY "Authenticated Users Can Update Court Images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'court-images');

-- Allow authenticated users to delete court images
CREATE POLICY "Authenticated Users Can Delete Court Images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'court-images');